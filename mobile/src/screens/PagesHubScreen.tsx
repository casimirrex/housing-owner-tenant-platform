import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { mobileApi } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import type { ProductPageCatalogItem } from "../api/types";
import type { RootStackParamList, RootTabParamList } from "../navigation/RootNavigator";
import { mobileStyles, palette } from "../styles/mobile";

type OpenAction = {
  label: string;
  onPress: () => void;
};

export function PagesHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const siteOverviewQuery = useQuery({
    queryKey: ["mobile-site-overview"],
    queryFn: () => mobileApi.getSiteOverview()
  });
  const productPagesQuery = useQuery({
    queryKey: ["mobile-product-pages"],
    queryFn: () => mobileApi.getProductPages()
  });

  const openTab = (screen: keyof RootTabParamList) => navigation.navigate("Tabs", { screen });

  const resolveAction = (item: ProductPageCatalogItem): OpenAction | null => {
    const page = item.page.toLowerCase();

    if (page.includes("splash") || page.includes("intro")) {
      return { label: "Open intro", onPress: () => navigation.navigate("Intro") };
    }
    if (page.includes("login")) {
      return { label: "Open login", onPress: () => navigation.navigate("Login") };
    }
    if (page.includes("otp")) {
      return { label: "Open OTP", onPress: () => navigation.navigate("OtpVerification") };
    }
    if (page.includes("sign up")) {
      return { label: "Open sign up", onPress: () => navigation.navigate("SignUp") };
    }
    if (page.includes("home")) {
      return { label: "Open home", onPress: () => openTab("Home") };
    }
    if (page.includes("search")) {
      return { label: "Open search", onPress: () => openTab("Search") };
    }
    if (page.includes("property detail")) {
      return {
        label: "Open property",
        onPress: () => navigation.navigate("PropertyDetail", { propertyId: "listing_001" })
      };
    }
    if (page.includes("matches")) {
      return { label: "Open matches", onPress: () => openTab("Matches") };
    }
    if (page.includes("dashboard page")) {
      return { label: "Open dashboard", onPress: () => openTab("Dashboard") };
    }
    if (page.includes("profile")) {
      return { label: "Open profile", onPress: () => openTab("Profile") };
    }
    if (page.includes("visit")) {
      return {
        label: "Open visits",
        onPress: () => navigation.navigate("Visits", { propertyId: "listing_001" })
      };
    }
    if (page.includes("saved") || page.includes("shortlist")) {
      return { label: "Open shortlist", onPress: () => navigation.navigate("Saved") };
    }
    if (page.includes("notification")) {
      return { label: "Open notifications", onPress: () => navigation.navigate("Notifications") };
    }
    if (page.includes("k-yc") || page.includes("e-kyc")) {
      return { label: "Open e-KYC", onPress: () => navigation.navigate("EKyc") };
    }
    if (page.includes("payment")) {
      return { label: "Open payments", onPress: () => navigation.navigate("Payments") };
    }
    if (page.includes("agreement")) {
      return { label: "Open agreement", onPress: () => navigation.navigate("Agreement") };
    }
    if (page.includes("monthly rent")) {
      return { label: "Open rent view", onPress: () => navigation.navigate("RentDashboard") };
    }

    return null;
  };

  return (
    <ScrollView contentContainerStyle={mobileStyles.container}>
      <Text style={mobileStyles.eyebrow}>{siteOverviewQuery.data?.eyebrow ?? "Mobile preview"}</Text>
      <Text style={mobileStyles.hero}>Browse every mobile app page from one screen.</Text>
      <Text style={mobileStyles.bodyText}>
        The app now opens into a page directory so you can test all major mobile flows on your
        laptop instead of hunting through partial navigation.
      </Text>

      <SectionCard subtitle="Fast access into the live API-backed mobile experience." title="Quick launch">
        <View style={styles.quickGrid}>
          <ActionButton label="Intro" onPress={() => navigation.navigate("Intro")} />
          <ActionButton label="Login" onPress={() => navigation.navigate("Login")} />
          <ActionButton label="Home" onPress={() => openTab("Home")} />
          <ActionButton label="Search" onPress={() => openTab("Search")} />
        </View>
      </SectionCard>

      <SectionCard
        subtitle={siteOverviewQuery.data?.description}
        title={siteOverviewQuery.data?.title ?? "Launch context"}
      >
        <View style={mobileStyles.wrapRow}>
          {siteOverviewQuery.data?.launchCities.map((city) => (
            <View key={city} style={mobileStyles.chip}>
              <Text style={mobileStyles.chipLabel}>{city}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        subtitle="This list is driven by the backend product-pages catalog and mapped into reachable mobile previews."
        title="Page inventory"
      >
        {productPagesQuery.data?.pages.map((item) => {
          const action = resolveAction(item);
          return (
            <View key={item.page} style={styles.pageCard}>
              <View style={styles.pageHeader}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.pageTitle}>{item.page}</Text>
                  <Text style={mobileStyles.bodyText}>{item.purpose}</Text>
                </View>
                <StatusPill label={action ? "Preview ready" : "Catalog"} tone={action ? "success" : "warning"} />
              </View>
              <Text style={styles.sourceText}>Source: {item.source}</Text>
              {action ? <ActionButton label={action.label} onPress={action.onPress} variant="secondary" /> : null}
            </View>
          );
        })}
      </SectionCard>

      <SectionCard subtitle="The following sections are populated from the backend site overview API." title="Journey phases">
        {siteOverviewQuery.data?.journeyPhases.map((phase) => (
          <Pressable key={phase.label} style={mobileStyles.inlineCard}>
            <Text style={styles.phaseTitle}>{phase.label}</Text>
            <Text style={mobileStyles.bodyText}>{phase.detail}</Text>
          </Pressable>
        ))}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickGrid: {
    gap: 10
  },
  pageCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 10
  },
  pageHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start"
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.text
  },
  sourceText: {
    color: palette.highlight,
    fontSize: 12,
    fontWeight: "700"
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.text
  }
});
