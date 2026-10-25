
import api from "./axios";

function getErrorMessage(error) {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "Unable to load nutrition report. Please try again."
  );
}

export async function getDailyNutritionReport(date) {
  try {
    const response = await api.get("/nutrition-reports/daily", {
      params: { date },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getWeeklyNutritionReport(startDate) {
  try {
    const response = await api.get("/nutrition-reports/weekly", {
      params: { startDate },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getNutritionReportRange(days) {
  if (![7, 14, 30].includes(days)) {
    throw new Error("Report range must be 7, 14, or 30 days.");
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const endDate = new Date();
  endDate.setHours(12, 0, 0, 0);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days + 1);

  const start = toISODate(startDate);
  const end = toISODate(endDate);

  const chunkStarts = [];

  for (let offset = 0; offset < days; offset += 7) {
    const chunkDate = new Date(startDate);
    chunkDate.setDate(chunkDate.getDate() + offset);
    chunkStarts.push(toISODate(chunkDate));
  }

  try {
    const weeklyReports = await Promise.all(
      chunkStarts.map((date) => getWeeklyNutritionReport(date))
    );

    const dailyMap = new Map();

    weeklyReports.forEach((weeklyReport) => {
      Object.entries(weeklyReport.dailySummaries || {}).forEach(
        ([date, summary]) => {
          if (date >= start && date <= end) {
            dailyMap.set(date, summary);
          }
        }
      );
    });

    const dailySummaries = {};

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const key = toISODate(date);

      dailySummaries[key] = dailyMap.get(key) || {
        date: key,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        totalSugar: 0,
        totalEntries: 0,
        vitamins: {},
        minerals: {},
      };
    }

    const fields = [
      "totalCalories",
      "totalProtein",
      "totalCarbs",
      "totalFat",
      "totalFiber",
      "totalSugar",
      "totalEntries",
    ];

    const totals = Object.values(dailySummaries).reduce(
      (result, day) => {
        fields.forEach((field) => {
          result[field] += Number(day[field]) || 0;
        });

        return result;
      },
      Object.fromEntries(fields.map((field) => [field, 0]))
    );

    function combineNutrients(property) {
      const result = {};

      Object.values(dailySummaries).forEach((day) => {
        Object.entries(day[property] || {}).forEach(([name, amount]) => {
          result[name] =
            (result[name] || 0) + (Number(amount) || 0);
        });
      });

      return result;
    }

    return {
      ...totals,
      startDate: start,
      endDate: end,
      days,
      dailySummaries,
      vitamins: combineNutrients("vitamins"),
      minerals: combineNutrients("minerals"),
      averageCalories: totals.totalCalories / days,
      averageProtein: totals.totalProtein / days,
      averageCarbs: totals.totalCarbs / days,
      averageFat: totals.totalFat / days,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
