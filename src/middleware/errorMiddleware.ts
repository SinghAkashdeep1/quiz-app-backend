import { Request, Response, NextFunction } from 'express';

const errorTranslations: Record<string, Record<string, string>> = {
  en: {
    'duplicate_username': 'Username already exists',
    'duplicate_email': 'Email already exists',
    'validation_error': 'Validation failed',
    'internal_error': 'Internal server error',
    'invalid_credentials': 'Invalid email or password',
    'not_authorized': 'Not authorized',
    'not_found': 'Resource not found',
    'already_exists': 'already exists'
  },
  hi: {
    'duplicate_username': 'उपयोगकर्ता नाम पहले से मौजूद है',
    'duplicate_email': 'ईमेल पहले से मौजूद है',
    'validation_error': 'सत्यापन विफल रहा',
    'internal_error': 'आंतरिक सर्वर त्रुटि',
    'invalid_credentials': 'अमान्य ईमेल या पासवर्ड',
    'not_authorized': 'अधिकृत नहीं है',
    'not_found': 'संसाधन नहीं मिला',
    'already_exists': 'पहले से मौजूद है'
  },
  es: {
    'duplicate_username': 'El nombre de usuario ya existe',
    'duplicate_email': 'El correo electrónico ya existe',
    'validation_error': 'Validación fallida',
    'internal_error': 'Error interno del servidor',
    'invalid_credentials': 'Correo electrónico o contraseña no válidos',
    'not_authorized': 'No autorizado',
    'not_found': 'Recurso no encontrado',
    'already_exists': 'ya existe'
  },
  fr: {
    'duplicate_username': "Le nom d'utilisateur existe déjà",
    'duplicate_email': 'L\'e-mail existe déjà',
    'validation_error': 'Échec de la validation',
    'internal_error': 'Erreur interne du serveur',
    'invalid_credentials': 'E-mail ou mot de passe incorrect',
    'not_authorized': 'Pas autorisé',
    'not_found': 'Ressource non trouvée',
    'already_exists': 'existe déjà'
  }
};

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const lang = (req.headers['accept-language'] || 'en').split(',')[0].split('-')[0];
  const t = errorTranslations[lang] || errorTranslations['en'];

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errorCode = 'INTERNAL_ERROR';

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    errorCode = `DUPLICATE_${field.toUpperCase()}`;
    message = t[errorCode.toLowerCase()] || `${field.charAt(0).toUpperCase() + field.slice(1)} ${t['already_exists']}`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
  }

  // Handle specific messages for auth
  if (message === 'Invalid email or password') {
     errorCode = 'INVALID_CREDENTIALS';
     message = t['invalid_credentials'];
  } else if (message === 'Not authorized' || message.includes('token failed')) {
     errorCode = 'NOT_AUTHORIZED';
     message = t['not_authorized'];
  } else if (message === 'User not found') {
     errorCode = 'NOT_FOUND';
     message = t['not_found'];
  }

  res.status(statusCode).json({
    message,
    code: errorCode,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { errorHandler };
