import vine from '@vinejs/vine'
import { FieldContext } from '@vinejs/vine/types'

export type Options = {}

/**
 * Implementation
 */
async function oneLowerCaseAtLeast(
  value: unknown,
  options: Options,
  field: FieldContext
) {

  if (typeof value !== 'string') {
    return
  }

  const regex = new RegExp('(?=.*[a-z])')
  if (!regex.test(value)) {
    field.report(
      'The {{ field }} must contain at least one lowercase letter',
      'oneLowerCaseAtLeast',
      field
    )
  }
}

/**
 * Converting a function to a VineJS rule
 */
export const oneLowerCaseAtLeastRule = vine.createRule(oneLowerCaseAtLeast)
