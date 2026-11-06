export const calculateAverage = (
  marks: readonly number[],
): number =>
  marks.length === 0
    ? 0
    : marks.reduce((sum, mark) => sum + mark, 0) /
      marks.length;

export const calculateSubjectStats = (
  marks: readonly number[] = [],
) => ({
  average: Number(calculateAverage(marks).toFixed(1)),
  count: marks.length,
});

export const calculateYearlyMark = (
  finalMarks: readonly number[],
): number | null =>
  finalMarks.length === 0
    ? null
    : Math.round(calculateAverage(finalMarks));
