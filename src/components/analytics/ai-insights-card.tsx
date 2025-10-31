"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";

/**
 * AI Report data structure
 */
export interface AIReport {
  _id: string;
  content: string;
  generatedAt: number;
  model: string;
  tokenUsage: {
    input: number;
    output: number;
    costUSD: number;
  };
}

interface AIInsightsCardProps {
  report: AIReport | null;
  onGenerateNew: () => void;
  isGenerating: boolean;
  error?: string | null;
}

/**
 * AI Coach Insights Card
 *
 * Displays AI-generated workout analysis with markdown rendering.
 * Handles empty state, loading state, and error state.
 *
 * @param report - AI report data (null if no report exists)
 * @param onGenerateNew - Callback to trigger report generation
 * @param isGenerating - Loading state during generation
 * @param error - Error message if generation failed
 */
export function AIInsightsCard({
  report,
  onGenerateNew,
  isGenerating,
  error,
}: AIInsightsCardProps) {
  // Empty state: No report yet
  if (!report && !isGenerating && !error) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-lg">AI Coach Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Get personalized technical analysis of your training data
            </p>
            <Button onClick={onGenerateNew} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Your First Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state: Generating report
  if (isGenerating) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-lg">AI Coach Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium mb-1">
              Analyzing your training...
            </p>
            <p className="text-xs text-muted-foreground">
              This may take 10-15 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state: Generation failed
  if (error) {
    return (
      <Card className="shadow-sm border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-lg">AI Coach Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={onGenerateNew} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state: Display report
  if (!report) return null;

  const timeAgo = formatDistanceToNow(new Date(report.generatedAt), {
    addSuffix: true,
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-lg">AI Coach Insights</CardTitle>
          </div>
          <Button
            onClick={onGenerateNew}
            variant="ghost"
            size="sm"
            className="gap-2"
            disabled={isGenerating}
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated {timeAgo} • {report.model}
        </p>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              // Style headers
              h1: ({ children }) => (
                <h2 className="text-lg font-bold mt-4 mb-2 first:mt-0">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h3 className="text-base font-semibold mt-3 mb-1">
                  {children}
                </h3>
              ),
              h3: ({ children }) => (
                <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>
              ),
              // Style paragraphs
              p: ({ children }) => (
                <p className="text-sm leading-relaxed mb-3">{children}</p>
              ),
              // Style lists
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-3">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-3">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-sm ml-2">{children}</li>
              ),
              // Style strong/emphasis
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              ),
              // Style code
              code: ({ children }) => (
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              // Style horizontal rules
              hr: () => <hr className="my-4 border-border" />,
            }}
          >
            {report.content}
          </ReactMarkdown>
        </div>

        {/* Cost transparency (optional, for debugging) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Cost: ${report.tokenUsage.costUSD.toFixed(4)} (
            {report.tokenUsage.input}+ {report.tokenUsage.output} tokens)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
