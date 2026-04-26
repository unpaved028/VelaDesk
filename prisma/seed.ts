import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up database...');
  
  // Mandatory order for cleanup (child records first)
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.sLA_Policy.deleteMany();
  await prisma.mailboxConfig.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🌱 Start seeding...');

  // 1. Create a Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      domain: 'acme.com',
      businessStartTime: '08:00',
      businessEndTime: '17:00',
      businessDays: '1,2,3,4,5', // Mon-Fri
      timezone: 'Europe/Berlin',
    },
  });

  // 2. Create 2 Workspaces
  const itWorkspace = await prisma.workspace.create({
    data: {
      tenantId: tenant.id,
      name: 'IT-Support',
      type: 'ITSM',
    },
  });

  // 2b. Add SLA Policy to IT Workspace
  await prisma.sLA_Policy.create({
    data: {
      tenantId: tenant.id,
      workspaceId: itWorkspace.id,
      name: 'Standard IT SLA',
      priority: 'MEDIUM',
      responseHours: 4,
      resolutionHours: 24,
    }
  });

  await prisma.sLA_Policy.create({
    data: {
      tenantId: tenant.id,
      workspaceId: itWorkspace.id,
      name: 'Critical IT SLA',
      priority: 'HIGH',
      responseHours: 1,
      resolutionHours: 4,
    }
  });

  const hrWorkspace = await prisma.workspace.create({
    data: {
      tenantId: tenant.id,
      name: 'HR',
      type: 'HR',
    },
  });

  // 3. Create Ticket Categories
  const hardwareCategory = await prisma.ticketCategory.create({
    data: {
      tenantId: tenant.id,
      workspaceId: itWorkspace.id,
      name: 'Hardware',
      description: 'Issues with laptops, monitors, keyboards, etc.'
    }
  });

  const softwareCategory = await prisma.ticketCategory.create({
    data: {
      tenantId: tenant.id,
      workspaceId: itWorkspace.id,
      name: 'Software',
      description: 'Software access, installations, and license issues.'
    }
  });

  // 4. Create Users
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@acme.com',
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'agent@example.com',
      name: 'Demo Agent',
      role: 'AGENT',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'alice@acme.com',
      name: 'Alice Smith',
      role: 'CUSTOMER',
    },
  });

  const bobCustomerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'bob@acme.com',
      name: 'Bob Johnson',
      role: 'CUSTOMER',
    },
  });

  // 5. Create 5 Tickets with Messages
  
  // Ticket 1: VPN Incident (High Complexity)
  const ticket1 = await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      workspaceId: itWorkspace.id,
      categoryId: softwareCategory.id,
      subject: 'Cannot access VPN',
      description: 'Hi, I cannot access the VPN since this morning. It says authentication failed.',
      status: 'OPEN',
      priority: 'HIGH',
      itilType: 'INCIDENT',
      requesterId: customerUser.id,
      assignedAgentId: agentUser.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        ticketId: ticket1.id,
        authorId: customerUser.id,
        body: 'Hi, I cannot access the VPN since this morning. It says authentication failed.',
        isInternal: false,
      },
      {
        ticketId: ticket1.id,
        authorId: agentUser.id,
        body: 'Checking the server logs. It seems your account is temporarily locked due to too many failed attempts.',
        isInternal: true,
      },
      {
        ticketId: ticket1.id,
        authorId: agentUser.id,
        body: 'Hello Alice, I have unlocked your account. Please try again with your standard credentials.',
        isInternal: false,
      },
      {
        ticketId: ticket1.id,
        authorId: customerUser.id,
        body: 'Thank you! It works now.',
        isInternal: false,
      }
    ]
  });

  // Ticket 2: Keyboard Request
  const ticket2 = await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      workspaceId: itWorkspace.id,
      categoryId: hardwareCategory.id,
      subject: 'Requesting new keyboard',
      description: 'My keyboard is broken. I need a new one.',
      status: 'PENDING',
      priority: 'MEDIUM',
      itilType: 'SERVICE_REQUEST',
      requesterId: bobCustomerUser.id,
      assignedAgentId: adminUser.id,
    },
  });

  await prisma.message.create({
    data: {
      ticketId: ticket2.id,
      authorId: bobCustomerUser.id,
      body: 'My keyboard is broken. I need a new one. The spacebar is sticking.',
      isInternal: false,
    }
  });

  // Ticket 3: Vacation Request
  await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      workspaceId: hrWorkspace.id,
      subject: 'Vacation request for August',
      description: 'I would like to request 2 weeks off in August.',
      status: 'NEW',
      priority: 'LOW',
      itilType: 'SERVICE_REQUEST',
      requesterId: customerUser.id,
    },
  });

  console.log('✅ Seeding finished successfully!');
  console.log(`🚀 Default Tenant ID: ${tenant.id}`);
  console.log(`📍 IT Workspace ID: ${itWorkspace.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
