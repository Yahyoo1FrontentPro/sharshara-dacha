export const formatPhone = (value) => {
  let digits = value.replace(/\D/g, '');
  
  if (!digits.startsWith('998')) {
    digits = '998' + digits; 
  }
  
  digits = digits.substring(0, 12);
  
  let res = '+' + digits.substring(0, 3);
  if (digits.length > 3) {
    res += ' ' + digits.substring(3, 5);
  }
  if (digits.length > 5) {
    res += ' ' + digits.substring(5, 8);
  }
  if (digits.length > 8) {
    res += ' ' + digits.substring(8, 10);
  }
  if (digits.length > 10) {
    res += ' ' + digits.substring(10, 12);
  }
  
  if (res === '+998') {
    res = '+998 ';
  }
  
  return res;
};
