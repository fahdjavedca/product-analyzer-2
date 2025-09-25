"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@repacked.co' },
        update: {},
        create: {
            email: 'admin@repacked.co',
            providerId: 'admin-provider-id',
            role: 'admin',
        },
    });
    console.log('✅ Admin user created:', adminUser.email);
    const adminSettings = await prisma.settings.upsert({
        where: { userId: adminUser.id },
        update: {},
        create: {
            userId: adminUser.id,
            defaultCountry: 'US',
            language: 'en',
            biddingStrategy: 'MAXIMIZE_CLICKS',
            dailyBudgetMicro: BigInt(1000000),
        },
    });
    console.log('✅ Admin settings created');
    const sampleProducts = [
        {
            sourcePlatform: 'cj_dropshipping',
            sourceProductId: 'sample-001',
            title: 'Wireless Bluetooth Headphones - Sample Product',
            descriptionRaw: 'High-quality wireless bluetooth headphones with superior sound quality and long battery life.',
            price: 29.99,
            currency: 'USD',
            vendorName: 'Sample Vendor',
            categoryPath: ['Electronics', 'Audio'],
            images: ['https://example.com/sample-headphones-1.jpg', 'https://example.com/sample-headphones-2.jpg'],
        },
        {
            sourcePlatform: 'aliexpress',
            sourceProductId: 'sample-002',
            title: 'Smart Fitness Tracker Watch',
            descriptionRaw: 'Advanced fitness tracker with heart rate monitoring, GPS, and waterproof design.',
            price: 49.99,
            currency: 'USD',
            vendorName: 'Fitness Tech',
            categoryPath: ['Electronics', 'Wearables'],
            images: ['https://example.com/sample-watch-1.jpg', 'https://example.com/sample-watch-2.jpg'],
        },
    ];
    for (const productData of sampleProducts) {
        const product = await prisma.product.upsert({
            where: {
                sourcePlatform_sourceProductId: {
                    sourcePlatform: productData.sourcePlatform,
                    sourceProductId: productData.sourceProductId,
                },
            },
            update: {},
            create: productData,
        });
        await prisma.shippingOption.createMany({
            data: [
                {
                    productId: product.id,
                    destinationCountry: 'US',
                    isShippable: true,
                    shippingCost: 6.00,
                    etaMinDays: 5,
                    etaMaxDays: 10,
                    methodName: 'Standard Shipping',
                },
                {
                    productId: product.id,
                    destinationCountry: 'CA',
                    isShippable: true,
                    shippingCost: 8.00,
                    etaMinDays: 7,
                    etaMaxDays: 12,
                    methodName: 'Standard Shipping',
                },
            ],
            skipDuplicates: true,
        });
        console.log(`✅ Sample product created: ${product.title}`);
    }
    console.log('🎉 Database seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map