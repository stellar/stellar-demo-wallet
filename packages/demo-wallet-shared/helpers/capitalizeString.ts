export const capitalizeString = (phrase: string) => {
  const [firstLetter, ...restOfWord] = phrase.split("");
  return firstLetter.toUpperCase() + restOfWord.join("");
};
