// Lightweight mock for isomorphic-dompurify in node test env
const mockSanitize = (html, _config = {}) => {
  if (!html) return '';
  let clean = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
    .replace(/<object[^>]*>.*?<\/object>/gis, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gis, '')
    .replace(/\son\w+="[^"]*"/gis, '')
    .replace(/\son\w+='[^']*'/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/data:[^"']+/gi, '');
  return clean;
};

module.exports = {
  sanitize: mockSanitize,
  default: { sanitize: mockSanitize }
};
