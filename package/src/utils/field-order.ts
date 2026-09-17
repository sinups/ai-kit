export type InputWrapperOrderItem = 'label' | 'input' | 'description' | 'error';

/** `inputWrapperOrder` that keeps inputs of side-by-side fields aligned by putting descriptions under the input */
export const FIELD_ORDER_DESCRIPTION_BELOW: InputWrapperOrderItem[] = [
  'label',
  'input',
  'description',
  'error',
];
