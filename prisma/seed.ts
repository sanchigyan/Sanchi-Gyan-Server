import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const plans = [
        {
            id: '21b92f0d-426a-4bb0-88f9-1e3f2d1b4a57',
            name: 'Free Trial',
            description: '7-day trial',
            monthlyPrice: 0,
            annualPrice: 0,
            features: ['Access to 5 beginner courses', 'Community support', 'Limited learning resources', '7-day free trial of premium features', 'Basic progress tracking'],
            limitations: ['No certificate of completion', 'Limited course access', 'Ad-supported experience'],
            isTrial: true,
            trialDays: 7,
        },
        {
            id: '825a304b-1cef-40cd-b3bd-6ee172fdd3ce',
            name: 'Basic',
            description: 'For self-paced learners',
            monthlyPrice: 799,
            annualPrice: 7990,
            features: [
                'Access to all courses',
                'Downloadable resources',
                'Ad-free experience',
                'Certificate of completion',
                'Progress tracking',
                'Email support'
            ],
            limitations: [
                'No live sessions',
                'Limited project feedback',
                'Standard video quality'
            ],
            isTrial: false,
            trialDays: null,
        },
        {
            id: '32ef983f-b3c4-4c98-a1d3-0682692049d2',
            name: 'Premium',
            description: 'Most popular for serious learners',
            monthlyPrice: 1299,
            annualPrice: 12990,
            features: [
                'Everything in Basic',
                'Live Q&A sessions',
                'Priority support',
                'Personalized learning path',
                'HD video quality',
                'Offline viewing',
                'Monthly career webinars'
            ],
            limitations: ['No 1:1 mentorship', 'Limited project reviews'],
            isTrial: false,
            trialDays: null,
        },
        {
            id: '8a291447-5588-41d1-918d-59efd25665a2',
            name: 'Pro',
            description: 'For career advancement',
            monthlyPrice: 1999,
            annualPrice: 19990,
            features: [
                'Everything in Premium',
                '1:1 mentorship sessions',
                'Project reviews & feedback',
                'Career coaching',
                'Resume review',
                'Job placement assistance',
                'Exclusive workshops',
                'Early access to new courses'
            ],
            limitations: [],
            isTrial: false,
            trialDays: null,
        }
    ];
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            update: {},
            create: plan,
        });
    }
    console.log('Plans seeded!');
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());