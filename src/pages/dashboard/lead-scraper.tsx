
import { Sparkles, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadScraperPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="bg-primary/10 p-3 rounded-full mb-4">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Lead Scraper</h1>
        <p className="text-muted-foreground max-w-2xl">
          Automatically discover and collect qualified leads from across the web
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-card/50 border-dashed hover:bg-card/80 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Intelligent Discovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-foreground/80">
              Our AI identifies high-quality leads by analyzing websites, social profiles, and business directories that match your target audience.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-dashed hover:bg-card/80 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Automated Enrichment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-foreground/80">
              Automatically enhance lead data with contact information, company details, and social profiles from multiple trusted sources.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-dashed hover:bg-card/80 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Seamless Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-foreground/80">
              Leads flow directly into your pipeline, ready for your AI agents to engage and nurture through personalized outreach.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="mx-auto max-w-3xl bg-muted/30">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Coming Soon
          </CardTitle>
          <CardDescription className="text-lg">
            We're putting the finishing touches on this exciting feature
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-center">
              Lead Scraper will enable you to automatically discover and import qualified leads from across the web, 
              saving you hours of manual research and data entry.
            </p>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
              <h3 className="font-medium mb-2">Be the first to know when it launches</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join the waitlist to get early access and special onboarding assistance.
              </p>
              <div className="flex justify-center">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  Join the waitlist 
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Have specific scraping needs? <a href="#" className="text-primary hover:underline">Let us know</a> and we'll prioritize your use case.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
