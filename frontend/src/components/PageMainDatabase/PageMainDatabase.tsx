import FilterSettings from "../FilterSettings";
import StaminaChartTable from "../StaminaChartTable";

export default function PageMainDatabase({ data }: { data: any }) {
  return <>
    <FilterSettings />
    <StaminaChartTable data={data} />
  </>
}