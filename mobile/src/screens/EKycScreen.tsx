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

export function EKycScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profileQuery = useQuery({
    queryKey: ["ekyc-profile"],
    queryFn: () => mobileApi.getUserProfile()
  });
  const propertyQuery = useQuery({
    queryKey: ["ekyc-property"],
    queryFn: () => mobileApi.getPropertyDetail("listing_001")
  });
  const pageCatalogQuery = useQuery({
    queryKey: ["ekyc-product-pages"],
    queryFn: () => mobileApi.getProductPages()
  });

  const ekycPage = pageCatalogQuery.data?.pages.find((page) => page.page.toLowerCase().includes("e-kyc"));

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>Verification</Text>
      <Text style={mobileStyles.hero}>The e-KYC page is now reachable from the mobile app.</Text>
      <Text style={mobileStyles.bodyText}>
        This preview uses live user and property readiness data while the dedicated Phase 2 KYC API
        is still pending.
      </Text>

      <SectionCard subtitle={ekycPage?.source ?? "Phase 2"} title="KYC readiness">
        <StatusPill
          label={propertyQuery.data?.ctaFlags.canStartKyc ? "KYC can start from property flow" : "Waiting on eligibility"}
          tone={propertyQuery.data?.ctaFlags.canStartKyc ? "success" : "warning"}
        />
        <Text style={mobileStyles.bodyText}>
          Tenant: {profileQuery.data?.fullName} • Status: {profileQuery.data?.profileStatus}
        </Text>
        <Text style={mobileStyles.bodyText}>
          Sample property: {propertyQuery.data?.property.title}
        </Text>
      </SectionCard>

      <SectionCard title="Suggested verification steps">
        {[
          "Confirm profile details and mobile number",
          "Upload identity proof and address proof",
          "Review verification status before payment or agreement"
        ].map((step) => (
          <View key={step} style={mobileStyles.inlineCard}>
            <Text style={mobileStyles.bodyText}>{step}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Open related pages">
        <ActionButton label="Open profile" onPress={() => navigation.navigate("Tabs", { screen: "Profile" })} />
        <ActionButton
          label="Open property detail"
          onPress={() => navigation.navigate("PropertyDetail", { propertyId: "listing_001" })}
          variant="secondary"
        />
      </SectionCard>
    </ScrollView>
  );
}
