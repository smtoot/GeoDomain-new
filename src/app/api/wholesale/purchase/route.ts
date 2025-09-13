import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/security/auth';
import { stripe, createWholesalePaymentIntent } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { wholesaleDomainId, paymentMethodId } = body;

    if (!wholesaleDomainId) {
      return NextResponse.json(
        { error: 'Wholesale domain ID is required' },
        { status: 400 }
      );
    }

    // Get wholesale domain details
    const wholesaleDomain = await prisma.wholesaleDomain.findUnique({
      where: { id: wholesaleDomainId },
      include: {
        domain: true,
        seller: true,
        buyer: true,
      },
    });

    if (!wholesaleDomain) {
      return NextResponse.json(
        { error: 'Wholesale domain not found' },
        { status: 404 }
      );
    }

    if (wholesaleDomain.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Domain is not available for purchase' },
        { status: 400 }
      );
    }

    if (wholesaleDomain.buyerId) {
      return NextResponse.json(
        { error: 'Domain has already been sold' },
        { status: 400 }
      );
    }

    // Get wholesale configuration
    const config = await prisma.wholesaleConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config || !config.isActive) {
      return NextResponse.json(
        { error: 'Wholesale marketplace is not active' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await createWholesalePaymentIntent(
      config.price,
      'usd',
      {
        wholesaleDomainId,
        domainName: wholesaleDomain.domain.name,
        buyerId: session.user.id,
        sellerId: wholesaleDomain.sellerId,
      }
    );

    // Create wholesale sale record
    const wholesaleSale = await prisma.wholesaleSale.create({
      data: {
        wholesaleDomainId,
        buyerId: session.user.id,
        sellerId: wholesaleDomain.sellerId,
        price: config.price,
        status: 'PENDING',
        paymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      sale: {
        id: wholesaleSale.id,
        price: wholesaleSale.price,
        status: wholesaleSale.status,
      },
    });

  } catch (error) {
    console.error('Error creating wholesale purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
}
