import { Request, Response, NextFunction } from "express"
import { ValidationChain, body, validationResult } from "express-validator"
import { RequestHandler } from "express-serve-static-core"

const validateRequest = (validations: ValidationChain[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    next();
  };
};

export const validateEventCreation: RequestHandler = validateRequest([
  body("name").notEmpty().withMessage("Name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("date").isISO8601().withMessage("Date must be a valid ISO 8601 date"),
  body("venue").notEmpty().withMessage("Venue is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be a positive integer"),
]);

export const validateRegistration = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return 
    }
    next()
  },
]

export const validateLogin = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return 
    }
    next()
  },
]
