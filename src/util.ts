
export const logger = {
  log: process.env.NODE_ENV === 'dev' ? console.log : () => {},
};

export const queryRE = /\?.*$/;
export const hashRE = /#.*$/;

export const cleanUrl = (url: string): string => url.replace(hashRE, '').replace(queryRE, '');

