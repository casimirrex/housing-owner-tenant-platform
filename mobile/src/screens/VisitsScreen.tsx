import { useMutation, useQuery } from "@tanstack/react-query";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { mobileStyles } from "../styles/mobile";

export function VisitsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Visits">>();
  const [propertyId, setPropertyId] = useState(route.params?.propertyId ?? "listing_001");
  const [preferredDate, setPreferredDate] = useState("2026-04-15");
  const [selectedSlotId, setSelectedSlotId] = useState("slot_morning_1");
  const [notes, setNotes] = useState("Please call 15 minutes before arrival.");

  const visitsQuery = useQuery({
    queryKey: ["mobile-visits"],
    queryFn: () => mobileApi.getVisits()
  });

  const slotsQuery = useQuery({
    queryKey: ["mobile-visit-slots", propertyId, preferredDate],
    queryFn: () => mobileApi.getVisitSlots(propertyId, preferredDate)
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      mobileApi.scheduleVisit({
        propertyId,
        slotId: selectedSlotId,
        preferredDate,
        notes
      })
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard subtitle="This page now supports available slots plus the schedule-visit POST call." title="Schedule a visit">
        <TextInput onChangeText={setPropertyId} style={mobileStyles.input} value={propertyId} />
        <TextInput onChangeText={setPreferredDate} style={mobileStyles.input} value={preferredDate} />
        <TextInput
          onChangeText={setSelectedSlotId}
          placeholder="slot_morning_1"
          style={mobileStyles.input}
          value={selectedSlotId}
        />
        <TextInput
          onChangeText={setNotes}
          style={[mobileStyles.input, mobileStyles.textarea]}
          value={notes}
        />
        <ActionButton
          label={scheduleMutation.isPending ? "Scheduling..." : "Schedule visit"}
          onPress={() => scheduleMutation.mutate()}
        />
        {scheduleMutation.data ? (
          <>
            <StatusPill label={scheduleMutation.data.status} tone="success" />
            <Text style={styles.meta}>{scheduleMutation.data.scheduledAt}</Text>
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="Scheduled visits">
        {visitsQuery.data?.items.map((visit) => (
          <View key={visit.visitId} style={styles.block}>
            <Text style={styles.title}>{visit.propertySummary.title}</Text>
            <Text style={styles.meta}>
              {visit.preferredDate} • {visit.slotLabel} • {visit.status}
            </Text>
            <Text style={styles.meta}>{visit.notes}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard subtitle={slotsQuery.data?.timeZone} title="Visit rules and slots">
        {slotsQuery.data?.visitRules.map((rule) => (
          <Text key={rule} style={styles.meta}>• {rule}</Text>
        ))}
        {slotsQuery.data?.slots.map((slot) => (
          <View key={slot.slotId} style={styles.slotCard}>
            <Text style={styles.title}>{slot.label}</Text>
            <Text style={styles.meta}>
              {slot.startTime} - {slot.endTime}
            </Text>
            <StatusPill label={slot.available ? "Available" : "Unavailable"} tone={slot.available ? "success" : "warning"} />
          </View>
        ))}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 18,
    backgroundColor: "#f6f0e8"
  },
  block: {
    gap: 4,
    paddingBottom: 10
  },
  title: {
    fontWeight: "700",
    color: "#172326"
  },
  slotCard: {
    gap: 6,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(23, 35, 38, 0.08)"
  },
  meta: {
    color: "#5e6c67",
    fontSize: 13,
    lineHeight: 19
  }
});
