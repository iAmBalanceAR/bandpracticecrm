import * as React from "react"
import CustomCard from "@/components/common/CustomCard"
import NotesAndRemindersCard from "./notes-and-reminders-card"

export default function NotesCard() {
  return (
 <CustomCard 
      title="Notes / Reminders"
      cardColor="[#d83b34]"
    >
      <NotesAndRemindersCard />
    </CustomCard>
  )
}