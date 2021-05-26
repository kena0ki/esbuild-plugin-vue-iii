
export const logger = {
  log: process.env.NODE_ENV === 'dev' ? console.log : () => {},
};

