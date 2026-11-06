import { Button } from "../../atoms/button/Button.tsx";

interface SelectOption<T extends string | number> {
  readonly key: T;
  readonly label: string;
}

interface TermSelectorProps<T extends string | number> {
  terms: readonly SelectOption<T>[];
  selectedTerm: T;
  onSelectTerm: (term: T) => void;
  classes: {
    tabs: string;
    tabBtn: string;
    tabBtnActive: string;
    tabBtnInactive: string;
  };
}

export const TermSelector = <T extends string | number>({
  terms,
  selectedTerm,
  onSelectTerm,
  classes: s,
}: TermSelectorProps<T>) => (
  <div className={s.tabs}>
    {terms.map(({ key, label }) => (
      <>
        <Button
          key={key}
          onClick={() => onSelectTerm(key)}
          className={`${s.tabBtn} ${selectedTerm === key ? s.tabBtnActive : s.tabBtnInactive}`}
        >
          {label}
        </Button>
      </>
    ))}
  </div>
);
