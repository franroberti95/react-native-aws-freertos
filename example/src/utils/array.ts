const uniqBy = (a: any[], compareFun: (a: any, b: any) => any) => {
  return a.reduce((accumulator, currentValue) => {
    if (!accumulator.some((item) => compareFun(item, currentValue))) {
      return [...accumulator, currentValue];
    }
    return accumulator;
  }, []);
};

export const arrayUtils = {
  uniqBy,
};
