import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from ".";
import "@/styles/globals.css";
const queryClient = new QueryClient();
import Head from "next/head";

const App = () => (
  <>
    <Head>
      <link rel="icon" href="/favicon.ico" />
      <title>TomTom Waes | Ontdek de wereld</title>
    </Head>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Index />
      </TooltipProvider>
    </QueryClientProvider>
  </>
);

export default App;
