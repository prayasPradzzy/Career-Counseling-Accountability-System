"use client";

import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";
import { ContentWrapper } from "./ContentWrapper";

/**
 * Universal AppLayout Framework Component
 * Serves as the presentation-only application shell for all authenticated pages.
 * Future modules plug directly into {children} without modifying AppLayout.
 */
export function AppLayout({ children, maxWidth }) {
  return (
    <div className="flex h-svh bg-background">
      {/* Left persistent desktop sidebar */}
      <DashboardSidebar />

      {/* Main content container */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sticky topbar */}
        <DashboardTopbar />

        {/* Page content area */}
        <main className="flex-1 overflow-auto">
          <ContentWrapper maxWidth={maxWidth}>{children}</ContentWrapper>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
