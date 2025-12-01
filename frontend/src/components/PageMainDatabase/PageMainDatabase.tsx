import { Heading } from "@chakra-ui/react";
import FilterSettings from "../FilterSettings";
import StaminaChartTable from "../StaminaChartTable";

export default function PageMainDatabase({ data }: { data: any }) {
  return <>
    <Heading as="h1" mb={6} textAlign="center">
      ITG Stamina Database
    </Heading>
    <FilterSettings />
    <StaminaChartTable data={data} />
  </>
}