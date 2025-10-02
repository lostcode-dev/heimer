import { SectionCards } from "./section-cards"
import { ChartAreaInteractive } from "./chart-area-interactive"

export default function DashboardPage() {
    return (
        <>
            <SectionCards />
            <div className="">
                <ChartAreaInteractive />
            </div>
        </>
    )
}