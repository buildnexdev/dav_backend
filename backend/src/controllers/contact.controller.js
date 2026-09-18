export async function postContact(req, res, next) {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'name, email, and message are required.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }

    // Placeholder: wire email/DB later.
    console.log('[contact]', { name, email, message });

    return res.status(201).json({
      success: true,
      message: 'Thanks for reaching out. Nandha will get back to you soon.'
    });
  } catch (error) {
    return next(error);
  }
}
