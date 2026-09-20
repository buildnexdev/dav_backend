export function ctaForMessage(message = '') {
  const q = String(message).toLowerCase();

  if (/(contact|email|reach|phone|call|hire|freelance|available|quote|rate|cost|services|buildnexdev)/i.test(q)) {
    return {
      type: 'contact',
      label: 'Contact Nandha Directly',
      href: '#contact',
      icon: 'fa-solid fa-envelope'
    };
  }

  if (/(project|work|portfolio|nammaqr|squarenow|getitnow|paisanow|venalaigal|thala|sai builders|srs)/i.test(q)) {
    return {
      type: 'projects',
      label: 'View Projects Section',
      href: '#projects',
      icon: 'fa-solid fa-laptop-code'
    };
  }

  return null;
}
