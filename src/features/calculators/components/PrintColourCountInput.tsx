type PrintColourCountInputProps = {
  ariaLabel: string;
  value: string;
  max?: number;
  onValueChange: (value: string) => void;
};

export function PrintColourCountInput({ ariaLabel, value, max, onValueChange }: PrintColourCountInputProps) {
  return <input aria-label={ariaLabel} className="hub-native-control h-8 w-16 px-2" max={max} type="text" inputMode="numeric" pattern="[0-9]*" value={value} onChange={(event) => onValueChange(event.target.value)} />;
}
