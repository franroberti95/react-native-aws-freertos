const uniqBy = (a: any[], key: (item: any) => any) => {
  const seen: any = {};
  return a.filter(function (item) {
    const k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
};

export const arrayUtils = {
  uniqBy,
};
