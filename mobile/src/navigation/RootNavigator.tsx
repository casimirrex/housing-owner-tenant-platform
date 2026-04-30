import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardScreen } from "../screens/DashboardScreen";
import { AgreementScreen } from "../screens/AgreementScreen";
import { EKycScreen } from "../screens/EKycScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { IntroScreen } from "../screens/IntroScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { MatchesScreen } from "../screens/MatchesScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { OtpVerificationScreen } from "../screens/OtpVerificationScreen";
import { PagesHubScreen } from "../screens/PagesHubScreen";
import { PaymentsScreen } from "../screens/PaymentsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PropertyDetailScreen } from "../screens/PropertyDetailScreen";
import { RentDashboardScreen } from "../screens/RentDashboardScreen";
import { SavedScreen } from "../screens/SavedScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { VisitsScreen } from "../screens/VisitsScreen";

export type RootStackParamList = {
  PageDirectory: undefined;
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  Intro: undefined;
  Login: undefined;
  OtpVerification: { flowId?: string; destination?: string } | undefined;
  SignUp: undefined;
  PropertyDetail: { propertyId: string };
  Visits: { propertyId?: string } | undefined;
  Saved: undefined;
  Notifications: undefined;
  EKyc: undefined;
  Payments: undefined;
  Agreement: undefined;
  RentDashboard: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Matches: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#20443b",
        tabBarInactiveTintColor: "#7d8783",
        tabBarStyle: {
          height: 68,
          paddingBottom: 10,
          paddingTop: 8
        }
      }}
    >
      <Tab.Screen component={HomeScreen} name="Home" />
      <Tab.Screen component={SearchScreen} name="Search" />
      <Tab.Screen component={MatchesScreen} name="Matches" />
      <Tab.Screen component={DashboardScreen} name="Dashboard" />
      <Tab.Screen component={ProfileScreen} name="Profile" />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PageDirectory">
        <Stack.Screen component={PagesHubScreen} name="PageDirectory" options={{ title: "Mobile app pages" }} />
        <Stack.Screen component={Tabs} name="Tabs" options={{ title: "Core app preview" }} />
        <Stack.Screen component={IntroScreen} name="Intro" options={{ title: "Splash / intro" }} />
        <Stack.Screen component={LoginScreen} name="Login" options={{ title: "Login" }} />
        <Stack.Screen component={OtpVerificationScreen} name="OtpVerification" options={{ title: "OTP verification" }} />
        <Stack.Screen component={SignUpScreen} name="SignUp" options={{ title: "Sign up" }} />
        <Stack.Screen component={PropertyDetailScreen} name="PropertyDetail" options={{ title: "Property detail" }} />
        <Stack.Screen component={VisitsScreen} name="Visits" options={{ title: "Visit scheduling" }} />
        <Stack.Screen component={SavedScreen} name="Saved" options={{ title: "Saved / shortlist" }} />
        <Stack.Screen component={NotificationsScreen} name="Notifications" options={{ title: "Notifications" }} />
        <Stack.Screen component={EKycScreen} name="EKyc" options={{ title: "e-KYC" }} />
        <Stack.Screen component={PaymentsScreen} name="Payments" options={{ title: "Payments" }} />
        <Stack.Screen component={AgreementScreen} name="Agreement" options={{ title: "e-Agreement" }} />
        <Stack.Screen component={RentDashboardScreen} name="RentDashboard" options={{ title: "Monthly rent dashboard" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
