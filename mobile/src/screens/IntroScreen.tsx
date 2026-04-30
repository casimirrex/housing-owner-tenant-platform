import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, Text, View } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { mobileStyles } from "../styles/mobile";

export function IntroScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const siteOverviewQuery = useQuery({
    queryKey: ["intro-site-overview"],
    queryFn: () => mobileApi.getSiteOverview()
  });
  const homeQuery = useQuery({
    queryKey: ["intro-home"],
    queryFn: () => mobileApi.getHome()
  });

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>{siteOverviewQuery.data?.eyebrow ?? "Rent and Beyond"}</Text>
      <Text style={mobileStyles.hero}>{siteOverviewQuery.data?.title ?? "Trust-first rental discovery."}</Text>
      <Text style={mobileStyles.bodyText}>
        {siteOverviewQuery.data?.description ??
          "A guided mobile onboarding experience for search, shortlist, visits, and digital workflow steps."}
      </Text>

      <SectionCard
        subtitle={homeQuery.data?.heroSearchConfig.searchPlaceholder}
        title={homeQuery.data?.heroSearchConfig.city ?? "Primary launch city"}
      >
        <Text style={mobileStyles.bodyText}>
          The intro flow pulls its context from the same backend that powers the discovery app.
        </Text>
        <View style={mobileStyles.wrapRow}>
          {siteOverviewQuery.data?.launchCities.map((city) => (
            <View key={city} style={mobileStyles.chip}>
              <Text style={mobileStyles.chipLabel}>{city}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="What the app covers">
        {siteOverviewQuery.data?.journeyPhases.map((phase) => (
          <View key={phase.label} style={mobileStyles.inlineCard}>
            <Text style={{ fontWeight: "700", color: "#172326" }}>{phase.label}</Text>
            <Text style={mobileStyles.bodyText}>{phase.detail}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard subtitle="Move from onboarding straight into live auth and discovery screens." title="Continue">
        <ActionButton label="Login" onPress={() => navigation.navigate("Login")} />
        <ActionButton label="Explore home" onPress={() => navigation.navigate("Tabs", { screen: "Home" })} variant="secondary" />
      </SectionCard>
    </ScrollView>
  );
}
