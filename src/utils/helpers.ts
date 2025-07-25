String.prototype.toTitleCase = function (this: string): string {
  return this
    .split(" ")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
};