import { NextRequest, NextResponse } from 'next/server';
import { stripe, validateWebhookSignature, getStripeWebhookSecret } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendWholesalePurchaseConfirmationEmail, sendWholesaleSaleNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const event = validateWebhookSignature(body, signature, webhookSecret);

    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      if (paymentIntent.metadata?.type === 'wholesale_domain_purchase') {
        await handleWholesalePaymentSuccess(paymentIntent);
      }
    }

    // Handle failed payment
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      if (paymentIntent.metadata?.type === 'wholesale_domain_purchase') {
        await handleWholesalePaymentFailure(paymentIntent);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleWholesalePaymentSuccess(paymentIntent: any) {
  try {
    const { wholesaleDomainId, buyerId, sellerId, domainName } = paymentIntent.metadata;

    // Update wholesale sale status
    const sale = await prisma.wholesaleSale.update({
      where: { paymentIntentId: paymentIntent.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        wholesaleDomain: {
          include: {
            domain: true,
            seller: true,
            buyer: true,
          },
        },
      },
    });

    // Update wholesale domain status
    await prisma.wholesaleDomain.update({
      where: { id: wholesaleDomainId },
      data: {
        status: 'SOLD',
        soldTo: buyerId,
        soldAt: new Date(),
      },
    });

    // Update domain ownership
    await prisma.domain.update({
      where: { id: sale.wholesaleDomain.domainId },
      data: {
        ownerId: buyerId,
        status: 'SOLD',
      },
    });

    // Send email notifications
    await sendWholesalePurchaseEmails(sale);

    console.log(`Wholesale purchase completed: ${domainName} sold to ${buyerId}`);

  } catch (error) {
    console.error('Error handling wholesale payment success:', error);
  }
}

async function handleWholesalePaymentFailure(paymentIntent: any) {
  try {
    // Update wholesale sale status
    await prisma.wholesaleSale.update({
      where: { paymentIntentId: paymentIntent.id },
      data: {
        status: 'FAILED',
      },
    });

    console.log(`Wholesale purchase failed: ${paymentIntent.metadata?.domainName}`);

  } catch (error) {
    console.error('Error handling wholesale payment failure:', error);
  }
}

async function sendWholesalePurchaseEmails(sale: any) {
  try {
    const { wholesaleDomain, buyer, seller } = sale;
    const domainName = wholesaleDomain.domain.name;

    // Email to buyer
    await sendWholesalePurchaseConfirmationEmail({
      domainName,
      price: sale.price,
      sellerName: seller.name || seller.email,
      sellerEmail: seller.email,
      transferInstructions: `
        Please contact the seller at ${seller.email} to arrange the domain transfer.
        The seller will initiate the transfer process from their domain registrar.
      `,
    }, buyer.email);

    // Email to seller
    await sendWholesaleSaleNotificationEmail({
      domainName,
      price: sale.price,
      buyerName: buyer.name || buyer.email,
      buyerEmail: buyer.email,
      transferInstructions: `
        Please initiate the domain transfer to ${buyer.email}.
        Contact your domain registrar to start the transfer process.
      `,
    }, seller.email);

  } catch (error) {
    console.error('Error sending wholesale purchase emails:', error);
  }
}
