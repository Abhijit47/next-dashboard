'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState = '' || undefined,
  formData = FormData
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: 'Please select a customer.' }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const State = {
  errors: {
    customerId: '',
    amount: '',
    status: '',
  },
  message: '' || null,
};

export async function createInvoice(prevState = State, formData = FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId},${amountInCents},${status},${date})
  `;
  } catch (err) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id = '',
  prevState = State,
  formData = FormData
) {
  // Validate form using Zod
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
  `;
  } catch (err) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  // clear cache and revalidate path
  revalidatePath('/dashboard/invoices');

  // redirect user to destination path
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id = '') {
  throw new Error('Failed to Delete Invoice');

  try {
    await sql`
    DELETE FROM invoices WHERE id = ${id}
  `;

    // clear cache and revalidate path
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (err) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }
}

// Old create invoice function
// export async function createInvoice(formData = FormData) {
//   // console.log(Object.fromEntries(formData.entries()));
//   // if many input fields
//   // const rawFormData = Object.fromEntries(formData.entries());

//   const { customerId, amount, status } = CreateInvoice.parse({
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   });

//   // amount in cents
//   const amountInCents = amount * 100;

//   // create a new data
//   const date = new Date().toISOString().split('T')[0];

//   try {
//     // lets add data into database
//     await sql`
//       INSERT INTO invoices (customer_id, amount, status, date)
//       VALUES (${customerId},${amountInCents},${status},${date})
//   `;
//   } catch (err) {
//     return {
//       message: 'Database Error: Failed to Create Invoice.',
//     };
//   }

//   // clear cache and revalidate path
//   revalidatePath('/dashboard/invoices');

//   // redirect user to destination path
//   redirect('/dashboard/invoices');
// }

// export async function updateInvoice(id = '', formData = FormData) {
//   const { customerId, amount, status } = UpdateInvoice.parse({
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   });

//   // amount in cents
//   const amountInCents = amount * 100;

//   try {
//     await sql`
//       UPDATE invoices
//       SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
//       WHERE id = ${id}
//   `;
//   } catch (err) {
//     return {
//       message: 'Database Error: Failed to Update Invoice.',
//     };
//   }

//   // clear cache and revalidate path
//   revalidatePath('/dashboard/invoices');

//   // redirect user to destination path
//   redirect('/dashboard/invoices');
// }
