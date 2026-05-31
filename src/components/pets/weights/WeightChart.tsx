import type { WeightRecord } from "@/hooks/useWeightHistory";
import type { PetCategory } from "@/types/pet.types";
import { fromMilligrams, pickDisplayUnit } from "@/utils/weight";
import React, { useMemo } from "react";
import { LineChart, type LineChartPoint } from "@/components/ui/LineChart";

interface WeightChartProps {
  records: WeightRecord[];
  category?: PetCategory;
  height?: number;
}

export function WeightChart({
  records,
  category,
  height = 200,
}: WeightChartProps): React.ReactElement | null {
  const points = useMemo<LineChartPoint[]>(() => {
    if (records.length === 0) return [];

    const sorted = [...records].sort((a, b) =>
      a.occurredAt < b.occurredAt ? -1 : 1,
    );

    const unit = pickDisplayUnit(sorted[sorted.length - 1].weightMg, category);
    return sorted.map((r) => {
      const d = new Date(r.occurredAt);
      return {
        value: fromMilligrams(r.weightMg, unit),
        xLabel: `${d.getDate()}/${d.getMonth() + 1}`,
      };
    });
  }, [records, category]);

  if (points.length === 0) return null;

  return <LineChart points={points} height={height} />;
}
