import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, Text, View } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { mobileStyles } from "../styles/mobile";

export function AgreementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const propertyQuery = useQuery({
    queryKey: ["agreement-property"],
    queryFn: () => mobileApi.getPropertyDetail("listing_001")
  });
  const profileQuery = useQuery({
    queryKey: ["agreement-profile"],
    queryFn: () => mobileApi.getUserProfile()
  });
  const pagesQuery = useQuery({
    queryKey: ["agreement-pages"],
    queryFn: () => mobileApi.getProductPages()
  });

  const agreementPage = pagesQuery.data?.pages.find((page) => page.page.toLowerCase().includes("agreement"));

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Digital agreement</Text>
      <Text style={mobileStyles.hero}>Review the agreement page in the mobile flow.</Text>
      <Text style={mobileStyles.bodyText}>
        The agreement preview reuses property and tenant data while the final signing APIs are
        still planned for a later phase.
      </Text>

      <SectionCard subtitle={agreementPage?.source ?? "Phase 2"} title="Agreement summary">
        <StatusPill label="Preview contract" tone="warning" />
        <Text style={mobileStyles.bodyText}>Tenant: {profileQuery.data?.fullName}</Text>
        <Text style={mobileStyles.bodyText}>Owner: {propertyQuery.data?.ownerInfo.name}</Text>
        <Text style={mobileStyles.bodyText}>Property: {propertyQuery.data?.property.title}</Text>
        <Text style={mobileStyles.bodyText}>Move-in target: {propertyQuery.data?.pricing.availableFrom}</Text>
      </SectionCard>

      <SectionCard title="Agreement checkpoints">
        {[
          "Validate tenant identity and owner information",
          "Review rent, deposit, maintenance, and move-in date",
          "Confirm sign flow after successful payment"
        ].map((item) => (
          <View key={item} style={mobileStyles.inlineCard}>
            <Text style={mobileStyles.bodyText}>{item}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Open adjacent flows">
        <ActionButton label="Open e-KYC" onPress={() => navigation.navigate("EKyc")} />
        <ActionButton label="Open payments" onPress={() => navigation.navigate("Payments")} variant="secondary" />
      </SectionCard>
    </ScrollView>
  );
}
