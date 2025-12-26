import { z } from 'zod';

// Auth validation schemas
export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email deve ter no máximo 255 caracteres' }),
  password: z.string()
    .min(1, { message: 'Senha é obrigatória' }),
});

export const signUpSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Nome contém caracteres inválidos' }),
  email: z.string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email deve ter no máximo 255 caracteres' }),
  password: z.string()
    .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
    .regex(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
    .regex(/[a-z]/, { message: 'Senha deve conter pelo menos uma letra minúscula' })
    .regex(/[0-9]/, { message: 'Senha deve conter pelo menos um número' }),
});

// Client validation schema
export const clientSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  email: z.string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email deve ter no máximo 255 caracteres' })
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .max(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
    .regex(/^[\d\s\-\+\(\)]*$/, { message: 'Telefone contém caracteres inválidos' })
    .optional()
    .or(z.literal('')),
  company: z.string()
    .trim()
    .max(100, { message: 'Empresa deve ter no máximo 100 caracteres' })
    .optional()
    .or(z.literal('')),
  country_code: z.string()
    .max(10, { message: 'Código do país inválido' })
    .optional(),
});

// Project validation schema
export const projectSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(200, { message: 'Nome deve ter no máximo 200 caracteres' }),
  client_id: z.string().uuid().optional().nullable(),
  total_value: z.number()
    .min(0, { message: 'Valor não pode ser negativo' })
    .max(999999999, { message: 'Valor máximo excedido' }),
  deadline: z.string().optional().nullable(),
  project_type: z.enum(['one_time', 'recurring']).optional(),
  currency: z.enum(['BRL', 'USD', 'EUR']).optional(),
  advance_payment: z.boolean().optional(),
  advance_percentage: z.number().min(0).max(100).optional(),
});

// Contract validation schema
export const contractSchema = z.object({
  title: z.string()
    .trim()
    .min(2, { message: 'Título deve ter pelo menos 2 caracteres' })
    .max(200, { message: 'Título deve ter no máximo 200 caracteres' }),
  client_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  terms: z.string()
    .max(50000, { message: 'Termos muito longos' })
    .optional()
    .nullable(),
});

// Signatory validation schema
export const signatorySchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  email: z.string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email deve ter no máximo 255 caracteres' }),
  role: z.enum(['contratante', 'contratado', 'testemunha', 'fiador', 'representante_legal']),
});

// Task validation schema
export const taskSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: 'Título é obrigatório' })
    .max(200, { message: 'Título deve ter no máximo 200 caracteres' }),
  description: z.string()
    .max(2000, { message: 'Descrição muito longa' })
    .optional()
    .nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional().nullable(),
});

// Financial transaction validation schema
export const transactionSchema = z.object({
  amount: z.number()
    .min(0.01, { message: 'Valor deve ser maior que zero' })
    .max(999999999, { message: 'Valor máximo excedido' }),
  type: z.enum(['income', 'expense']),
  category: z.string()
    .trim()
    .min(1, { message: 'Categoria é obrigatória' })
    .max(50, { message: 'Categoria muito longa' }),
  description: z.string()
    .max(500, { message: 'Descrição muito longa' })
    .optional()
    .nullable(),
  date: z.string().optional(),
  project_id: z.string().uuid().optional().nullable(),
});

// URL validation for links
export const urlSchema = z.string()
  .url({ message: 'URL inválida' })
  .max(2000, { message: 'URL muito longa' })
  .optional()
  .or(z.literal(''));

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type SignatoryInput = z.infer<typeof signatorySchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
