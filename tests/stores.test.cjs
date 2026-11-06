const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const mobx = require("mobx");

// Compile the actual stores with injected Firebase boundaries; no live writes.
function load(file, modules, globals = {}) {
  const source = fs
    .readFileSync(path.join(__dirname, "..", file), "utf8")
    .replaceAll("import.meta.env", "({})");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2023,
    },
  }).outputText;
  const context = {
    exports: {},
    console: { error() {} },
    setTimeout,
    clearTimeout,
    require(name) {
      assert.ok(
        name in modules,
        `Unexpected dependency: ${name}`,
      );
      return modules[name];
    },
    ...globals,
  };
  vm.runInNewContext(code, context);
  return context.exports;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const stamp = (value) => ({ toMillis: () => value });
const flush = () =>
  new Promise((resolve) => setImmediate(resolve));

function userHarness() {
  let listener;
  let failWrite = false;
  let signInError = null;
  let writeGate = null;
  const records = new Map([
    [
      "students/student",
      {
        name: "Student",
        classId: "7_B",
        parents: [],
        telegramChatIds: [],
      },
    ],
    [
      "students/other",
      {
        name: "Other",
        classId: "8_A",
        parents: [],
        telegramChatIds: [],
      },
    ],
    [
      "users_parents/parent",
      {
        name: "Parent",
        role: "parent",
        email: "parent@example.com",
        children: ["student"],
      },
    ],
  ]);
  const writes = [],
    deletes = [];
  const auth = { signOut: async () => listener(null) };
  const snapshot = (id, data) => ({
    id,
    exists: () => !!data,
    data: () => data,
  });
  const collections = {
    subjects: [snapshot("math", { name: "Math" })],
    academic_years: [
      snapshot("year", {
        name: "Year",
        startDate: stamp(1),
        endDate: stamp(9),
        isCompleted: false,
      }),
    ],
    "academic_years/year/terms": [
      snapshot("term_custom", {
        name: "Term",
        startDate: stamp(1),
        endDate: stamp(9),
        isCompleted: false,
      }),
    ],
    grades: [],
  };
  let id = 0;
  const firestore = {
    doc: (base, ...parts) =>
      typeof base === "string"
        ? { path: `${base}/${++id}`, id: String(id) }
        : { path: parts.join("/"), id: parts.at(-1) },
    collection: (_, ...parts) => parts.join("/"),
    query: (collection) => collection,
    where() {},
    Timestamp: { now: () => stamp(5) },
    getDoc: async (ref) =>
      snapshot(ref.id, records.get(ref.path)),
    getDocs: async (collection) => ({
      docs: collections[collection],
      forEach: (fn) => collections[collection].forEach(fn),
    }),
    setDoc: async (ref, value) => {
      if (writeGate) await writeGate.promise;
      if (failWrite) throw new Error("Write failed");
      writes.push({ ref, value });
    },
    deleteDoc: async (ref) => {
      if (failWrite) throw new Error("Delete failed");
      deletes.push(ref);
    },
    writeBatch: () => {
      const pendingWrites = [],
        pendingDeletes = [];
      return {
        set: (ref, value) =>
          pendingWrites.push({ ref, value }),
        delete: (ref) => pendingDeletes.push(ref),
        commit: async () => {
          if (writeGate) await writeGate.promise;
          if (failWrite) throw new Error("Batch failed");
          writes.push(...pendingWrites);
          deletes.push(...pendingDeletes);
        },
      };
    },
  };
  const { userStore: store } = load(
    "src/store/UserStore.tsx",
    {
      mobx,
      "firebase/firestore": firestore,
      "firebase/auth": {
        onAuthStateChanged: (_, fn) => {
          listener = fn;
        },
        signInWithEmailAndPassword: async () => {
          if (signInError) throw signInError;
          listener({ uid: "student" });
        },
      },
      "../../firebase.ts": { auth, db: {} },
      "react-hot-toast": { error() {}, success() {} },
      "../utils/firestoreRequest.ts": {
        firestoreRequest: (request) => request,
      },
    },
  );
  return {
    store,
    emit: (user) => listener(user),
    writes,
    deletes,
    records,
    failWrite: (value) => {
      failWrite = value;
    },
    failLogin: (value) => {
      signInError = value;
    },
    gateWrite: (value) => {
      writeGate = value;
    },
  };
}

test("auth restoration and parent profiles load the child's actual class and reference data", async () => {
  const h = userHarness();
  assert.equal(h.store.isAuthReady, false);
  h.emit({ uid: "parent" });
  await flush();
  assert.equal(h.store.isAuthReady, true);
  assert.equal(h.store.isLoading, false);
  assert.equal(h.store.currentUserProfile.uid, "parent");
  assert.equal(h.store.profile.uid, "student");
  assert.equal(h.store.profile.classId, "7_B");
  assert.equal(h.store.currentTerms[0].id, "term_custom");
  h.emit(null);
  assert.equal(h.store.profile, null);
  assert.equal(h.store.currentGrades.length, 0);
});

test("failed login finishes without authenticating or hiding the form behind profile loading", async () => {
  const h = userHarness();
  h.emit(null);
  h.failLogin({ code: "auth/invalid-credential" });
  await h.store.login("bad", "bad");
  assert.equal(h.store.user, null);
  assert.equal(h.store.isSigningIn, false);
  assert.equal(h.store.isLoading, false);
  assert.ok(h.store.authError);
});

test("grade views separate final marks and exclude other students, years, and terms", async () => {
  const h = userHarness();
  h.emit({ uid: "student" });
  await flush();
  const base = {
    studentId: "student",
    subjectId: "math",
    yearId: "year",
    termId: "term_custom",
    value: 8,
    createdAt: stamp(1),
    isFinal: false,
  };
  mobx.runInAction(() => {
    h.store.currentGrades = [
      { ...base, id: "current" },
      { ...base, id: "final", value: 9, isFinal: true },
      { ...base, id: "other", studentId: "other" },
      { ...base, id: "old", yearId: "old" },
      { ...base, id: "term", termId: "other" },
    ];
  });
  const row = h.store.getSubjectMarks("term_custom")[0];
  assert.equal(row.currentMarks.length, 1);
  assert.equal(row.currentMarks[0].id, "current");
  assert.equal(row.finalMark.value, 9);
});

test("switching students ignores the previous profile response", async () => {
  const h = userHarness();
  h.emit({ uid: "parent" });
  await flush();
  const first = h.store.loadStudentProfile("student");
  const second = h.store.loadStudentProfile("other");
  await Promise.all([first, second]);
  assert.equal(h.store.profile.uid, "other");
  assert.equal(h.store.profile.classId, "8_A");
  assert.equal(h.store.isLoading, false);
});

test("invalid marks and missing subject or term references do not write", async () => {
  const h = userHarness();
  h.emit({ uid: "student" });
  await flush();
  for (const value of [0, 11, NaN, 1.5]) {
    assert.equal(
      await h.store.addMarkAndSave(
        "student",
        "math",
        "term_custom",
        value,
      ),
      false,
    );
  }
  assert.equal(
    await h.store.addMarkAndSave(
      "student",
      "missing",
      "term_custom",
      8,
    ),
    false,
  );
  assert.equal(
    await h.store.addMarkAndSave(
      "student",
      "math",
      "missing",
      8,
    ),
    false,
  );
  assert.equal(h.writes.length, 0);
});

test("grade writes preserve screen loading state and undo restores the exact deleted document", async () => {
  const h = userHarness();
  h.emit({ uid: "student" });
  await flush();
  const gate = deferred();
  h.gateWrite(gate);
  const saving = h.store.addMarkAndSave(
    "student",
    "math",
    "term_custom",
    8,
    "Comment",
  );
  assert.equal(h.store.isSavingGrade, true);
  assert.equal(h.store.isLoading, false);
  gate.resolve();
  assert.equal(await saving, true);
  h.gateWrite(null);
  await h.store.addMarkAndSave(
    "student",
    "math",
    "term_custom",
    8,
  );
  const original = h.store.currentGrades[0];
  assert.equal(
    await h.store.deleteMarkAndSave("student", original.id),
    true,
  );
  assert.equal(h.store.currentGrades.length, 2);
  assert.equal(h.deletes[0].path, `grades/${original.id}`);
  assert.equal(await h.store.restoreGrade(original), true);
  const restored = h.store.currentGrades.find(
    (grade) => grade.id === original.id,
  );
  assert.equal(restored.comment, "Comment");
  assert.equal(
    restored.createdAt.toMillis(),
    original.createdAt.toMillis(),
  );
  h.failWrite(true);
  assert.equal(
    await h.store.deleteMarkAndSave("student", original.id),
    false,
  );
  assert.equal(h.store.currentGrades.length, 3);
  assert.equal(h.store.isSavingGrade, false);
});

test("term finals recalculate on add, delete, and undo and disappear with the last mark", async () => {
  const h = userHarness();
  h.emit({ uid: "student" });
  await flush();
  const row = () =>
    h.store.getSubjectMarks("term_custom")[0];
  await h.store.addMarkAndSave(
    "student",
    "math",
    "term_custom",
    7,
  );
  const first = row().currentMarks[0];
  const finalId = row().finalMark.id;
  assert.equal(row().finalMark.value, 7);
  await h.store.addMarkAndSave(
    "student",
    "math",
    "term_custom",
    8,
  );
  assert.equal(row().finalMark.value, 8);
  assert.equal(row().finalMark.id, finalId);
  const second = row().currentMarks.find(
    (grade) => grade.id !== first.id,
  );
  await h.store.deleteMarkAndSave("student", second.id);
  assert.equal(row().finalMark.value, 7);
  await h.store.deleteMarkAndSave("student", first.id);
  assert.equal(row().finalMark, null);
  assert.ok(h.deletes.some((ref) => ref.id === finalId));
  await h.store.restoreGrade(second);
  assert.equal(row().finalMark.value, 8);
  assert.equal(h.writes.at(-1).value.isFinal, true);

  h.failWrite(true);
  const writesBefore = h.writes.length;
  assert.equal(
    await h.store.addMarkAndSave(
      "student",
      "math",
      "term_custom",
      2,
    ),
    false,
  );
  assert.equal(row().finalMark.value, 8);
  assert.equal(row().currentMarks.length, 1);
  assert.equal(h.writes.length, writesBefore);
});

test("schedule responses for old days and classes cannot replace the current selection", async () => {
  const requests = [];
  const { scheduleStore: store } = load(
    "src/store/ScheduleStore.ts",
    {
      mobx,
      "../services/ScheduleService.ts": {
        ScheduleService: {
          getDaySchedule: () => {
            const request = deferred();
            requests.push(request);
            return request.promise;
          },
        },
      },
    },
  );
  const first = store.fetchSchedule("7_B", "monday");
  const second = store.fetchSchedule("8_A", "tuesday");
  requests[0].resolve({ lessons: [{ id: "old" }] });
  await first;
  assert.equal(store.currentSchedule, null);
  assert.equal(store.isLoading, true);
  requests[1].resolve({ lessons: [{ id: "new" }] });
  await second;
  assert.equal(store.currentSchedule.lessons[0].id, "new");
  assert.equal(store.classId, "8_A");
  const third = store.fetchSchedule("8_A", "wednesday");
  store.reset();
  requests[2].resolve({ lessons: [{ id: "late" }] });
  await third;
  assert.equal(store.currentSchedule, null);
  assert.equal(store.isLoading, false);
});

test("schedule errors and missing days clear old lessons and finish loading", async () => {
  let fail = true;
  const { scheduleStore: store } = load(
    "src/store/ScheduleStore.ts",
    {
      mobx,
      "../services/ScheduleService.ts": {
        ScheduleService: {
          getDaySchedule: async () => {
            if (fail) throw new Error("Offline");
            return null;
          },
        },
      },
    },
  );
  await store.fetchSchedule("7_B", "monday");
  assert.ok(store.error);
  assert.equal(store.isLoading, false);
  fail = false;
  await store.fetchSchedule("7_B", "monday");
  assert.equal(store.error, null);
  assert.equal(store.currentSchedule.lessons.length, 0);
});

test("Firestore requests time out and clear their timer on success", async () => {
  const timers = new Map();
  const { firestoreRequest } = load(
    "src/utils/firestoreRequest.ts",
    {},
    {
      setTimeout: (fn) => {
        const id = {};
        timers.set(id, fn);
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  );
  assert.equal(
    await firestoreRequest(Promise.resolve("ok")),
    "ok",
  );
  assert.equal(timers.size, 0);
  const pending = firestoreRequest(new Promise(() => {}));
  const rejection = assert.rejects(pending);
  for (const fn of timers.values()) fn();
  await rejection;
  assert.equal(timers.size, 0);
});
