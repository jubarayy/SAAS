/**
 * MarkupFlow seed script — local development only
 * Run with: npx ts-node prisma/seed.ts
 * Or: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MarkupFlow database...");

  // ─── Users ───────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "alex@riverstudio.dev" },
    update: {},
    create: {
      email: "alex@riverstudio.dev",
      name: "Alex Rivera",
      passwordHash,
      emailVerified: new Date(),
      platformRole: "user",
    },
  });

  const teamMember = await prisma.user.upsert({
    where: { email: "sam@riverstudio.dev" },
    update: {},
    create: {
      email: "sam@riverstudio.dev",
      name: "Sam Chen",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@markupflow.com" },
    update: {},
    create: {
      email: "admin@markupflow.com",
      name: "Platform Admin",
      passwordHash,
      emailVerified: new Date(),
      platformRole: "platform_admin",
    },
  });

  // ─── Workspace ────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: "river-studio" },
    update: {},
    create: {
      name: "River Studio",
      slug: "river-studio",
      website: "https://riverstudio.dev",
      planSlug: "starter",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: owner.id, role: "owner" },
          { userId: teamMember.id, role: "team_member" },
        ],
      },
    },
  });

  // ─── Clients ─────────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: "contact@acmecorp.com" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Acme Corporation",
      email: "contact@acmecorp.com",
      company: "Acme Corp",
      website: "https://acmecorp.com",
      notes: "Key account. CEO is directly involved in approvals.",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: "hello@brightlabs.io" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Bright Labs",
      email: "hello@brightlabs.io",
      company: "Bright Labs Inc.",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Jordan Park",
      company: "Independent Consultant",
    },
  });

  // ─── Projects ─────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      clientId: client1.id,
      name: "Acme Website Redesign",
      description: "Full website redesign. 8 pages. Responsive. CMS integration.",
      type: "website",
      status: "in_review",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      internalNote: "Client expects fast turnaround. Already sent v2 for review.",
      members: { create: [{ userId: owner.id }, { userId: teamMember.id }] },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      clientId: client2.id,
      name: "Bright Labs Landing Page",
      description: "SaaS landing page for product launch",
      type: "landing_page",
      status: "active",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      members: { create: [{ userId: owner.id }] },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      clientId: client1.id,
      name: "Acme Brand Identity",
      type: "branding",
      status: "approved",
      members: { create: [{ userId: owner.id }] },
    },
  });

  // ─── Deliverables ─────────────────────────────────
  const del1 = await prisma.deliverable.create({
    data: {
      projectId: project1.id,
      name: "Homepage v2",
      type: "url",
      status: "in_review",
      versions: {
        create: {
          versionNumber: 2,
          label: "v2",
          url: "https://acme-redesign.riverstudio.dev",
          notes: "Updated hero section and added social proof",
          uploadedById: owner.id,
          isLatest: true,
        },
      },
    },
  });

  const del2 = await prisma.deliverable.create({
    data: {
      projectId: project1.id,
      name: "Figma Design System",
      type: "figma",
      status: "approved",
      sortOrder: 1,
      versions: {
        create: {
          versionNumber: 1,
          label: "v1",
          url: "https://figma.com/file/example",
          uploadedById: owner.id,
          isLatest: true,
        },
      },
    },
  });

  const del3 = await prisma.deliverable.create({
    data: {
      projectId: project2.id,
      name: "Landing Page",
      type: "url",
      status: "pending_review",
      versions: {
        create: {
          versionNumber: 1,
          label: "v1",
          url: "https://brightlabs-landing.riverstudio.dev",
          uploadedById: owner.id,
          isLatest: true,
        },
      },
    },
  });

  // ─── Review Links ─────────────────────────────────
  const reviewLink = await prisma.reviewLink.create({
    data: {
      projectId: project1.id,
      token: "demo-review-token-acme-v2",
      label: "Round 2 Review",
      isActive: true,
    },
  });

  // ─── Feedback ─────────────────────────────────────
  const fb1 = await prisma.feedbackItem.create({
    data: {
      deliverableId: del1.id,
      reviewLinkId: reviewLink.id,
      posX: 15.5,
      posY: 30.2,
      pageUrl: "https://acme-redesign.riverstudio.dev",
      status: "open",
      clientName: "Sarah Acme",
      clientEmail: "contact@acmecorp.com",
      comments: {
        create: {
          content: "The hero text feels too large on mobile. Can we reduce the font size?",
          clientName: "Sarah Acme",
          clientEmail: "contact@acmecorp.com",
        },
      },
    },
  });

  const fb2 = await prisma.feedbackItem.create({
    data: {
      deliverableId: del1.id,
      reviewLinkId: reviewLink.id,
      posX: 72.0,
      posY: 55.8,
      status: "resolved",
      clientName: "Sarah Acme",
      assignedToId: teamMember.id,
      resolvedAt: new Date(),
      resolvedById: teamMember.id,
      comments: {
        create: {
          content: "The call-to-action button color doesn't match our brand. Please use #2563EB.",
          clientName: "Sarah Acme",
        },
      },
    },
  });

  // Internal comment
  await prisma.feedbackComment.create({
    data: {
      feedbackItemId: fb2.id,
      content: "Fixed — updated to the brand blue. Resolved.",
      userId: teamMember.id,
      isInternal: false,
    },
  });

  // ─── Approval Action ──────────────────────────────
  const reviewSession = await prisma.reviewSession.create({
    data: {
      reviewLinkId: reviewLink.id,
      clientName: "Sarah Acme",
      clientEmail: "contact@acmecorp.com",
      status: "viewed",
      viewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  // ─── Notifications ────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: owner.id,
        projectId: project1.id,
        type: "feedback_created",
        title: "New feedback on Homepage v2",
        body: "Sarah Acme left a comment",
        actionUrl: `/projects/${project1.id}`,
        isRead: false,
      },
      {
        workspaceId: workspace.id,
        userId: owner.id,
        projectId: project3.id,
        type: "project_approved",
        title: "Acme Brand Identity approved",
        body: "Sarah Acme approved the project",
        actionUrl: `/projects/${project3.id}`,
        isRead: true,
      },
    ],
  });

  // ─── Audit logs ───────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        userId: owner.id,
        action: "create",
        entity: "project",
        entityId: project1.id,
        metadata: { name: project1.name },
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        userId: owner.id,
        action: "create",
        entity: "review_link",
        entityId: reviewLink.id,
      },
    ],
  });

  console.log("✅ Seed complete!\n");
  console.log("─────────────────────────────────────────");
  console.log("Test accounts (password: password123):");
  console.log("  Owner:          alex@riverstudio.dev");
  console.log("  Team member:    sam@riverstudio.dev");
  console.log("  Platform admin: admin@markupflow.com");
  console.log("─────────────────────────────────────────");
  console.log(`Demo review portal: /review/demo-review-token-acme-v2`);
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
