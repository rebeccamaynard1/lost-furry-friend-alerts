import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Alabama's 67 counties
export const ALABAMA_COUNTIES = [
  "Autauga", "Baldwin", "Barbour", "Bibb", "Blount", "Bullock", "Butler", "Calhoun",
  "Chambers", "Cherokee", "Chilton", "Choctaw", "Clarke", "Clay", "Cleburne", "Coffee",
  "Colbert", "Conecuh", "Coosa", "Covington", "Crenshaw", "Cullman", "Dale", "Dallas",
  "DeKalb", "Elmore", "Escambia", "Etowah", "Fayette", "Franklin", "Geneva", "Greene",
  "Hale", "Henry", "Houston", "Jackson", "Jefferson", "Lamar", "Lauderdale", "Lawrence",
  "Lee", "Limestone", "Lowndes", "Macon", "Madison", "Marengo", "Marion", "Marshall",
  "Mobile", "Monroe", "Montgomery", "Morgan", "Perry", "Pickens", "Pike", "Randolph",
  "Russell", "St. Clair", "Shelby", "Sumter", "Talladega", "Tallapoosa", "Tuscaloosa",
  "Walker", "Washington", "Wilcox", "Winston",
];

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  includeOther?: boolean;
};

export default function CountyPicker({ value, onChange, placeholder = "Select county", includeOther = true }: Props) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="bg-background"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="max-h-72">
        {ALABAMA_COUNTIES.map((c) => (
          <SelectItem key={c} value={c}>{c} County</SelectItem>
        ))}
        {includeOther && <SelectItem value="Other">Other / Out of state</SelectItem>}
      </SelectContent>
    </Select>
  );
}
