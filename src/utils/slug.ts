import slugify from 'slugify';

export const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

export const generateUniqueUsername = (firstName: string, lastName: string): string => {
  const base = slugify(`${firstName}-${lastName}`, { lower: true, strict: true });
  const random = Math.floor(Math.random() * 10000);
  return `${base}-${random}`;
};
