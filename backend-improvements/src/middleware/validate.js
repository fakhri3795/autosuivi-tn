const Joi = require('joi');

// ─── Schemas ─────────────────────────────────────────────────────────────────

const vehicleSchema = Joi.object({
  id: Joi.string().optional(), // Client-generated UUID (optional, server generates if missing)
  brand: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'La marque est requise',
  }),
  model: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Le modèle est requis',
  }),
  year: Joi.number().integer().min(1950).max(new Date().getFullYear() + 1).required().messages({
    'number.min': 'Année invalide',
    'number.max': 'Année invalide',
  }),
  plate: Joi.string().min(1).max(20).required().messages({
    'string.empty': "La plaque d'immatriculation est requise",
  }),
  initial_mileage: Joi.number().integer().min(0).required().messages({
    'number.min': 'Le kilométrage initial doit être positif',
  }),
  current_mileage: Joi.number().integer().min(0).optional(),
});

const maintenanceSchema = Joi.object({
  id: Joi.string().required(),
  vehicle_id: Joi.string().required().messages({
    'string.empty': "L'ID du véhicule est requis",
  }),
  type: Joi.string().valid(
    'VIDANGE', 'FILTRE_HUILE', 'FILTRE_AIR', 'FILTRE_HABITACLE',
    'FREINS', 'PNEUS', 'COURROIE_DISTRIBUTION'
  ).required().messages({
    'any.only': 'Type de maintenance invalide',
  }),
  date: Joi.string().isoDate().required().messages({
    'string.isoDate': 'Format de date invalide',
  }),
  mileage: Joi.number().integer().min(0).required().messages({
    'number.min': 'Le kilométrage doit être positif',
  }),
  cost: Joi.number().min(0).allow(null).optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
});

const deadlineSchema = Joi.object({
  id: Joi.string().optional(),
  vehicle_id: Joi.string().required(),
  type: Joi.string().valid('ASSURANCE', 'VIGNETTE', 'VISITE_TECHNIQUE').required().messages({
    'any.only': "Type d'échéance invalide",
  }),
  expiry_date: Joi.string().isoDate().required().messages({
    'string.isoDate': 'Format de date invalide',
  }),
});

const mileageSchema = Joi.object({
  value: Joi.number().integer().min(0).required(),
  date: Joi.string().isoDate().required(),
});

// ─── Middleware factory ──────────────────────────────────────────────────────

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        error: 'Données invalides',
        details: errors,
      });
    }
    next();
  };
};

module.exports = {
  validate,
  vehicleSchema,
  maintenanceSchema,
  deadlineSchema,
  mileageSchema,
};
