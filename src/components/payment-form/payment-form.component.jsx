import { useElements, useStripe } from '@stripe/react-stripe-js';
import { CardElement } from '@stripe/react-stripe-js';
import { useContext } from 'react';
import { BasketContext } from '../../contexts/basket.context';
import { CustomerContext } from '../../contexts/customer.context';
import { createOrderDocument } from '../../utils/firebase/firebase.utils';
import FormButton from '../form-button/form-button.component';
import './payment-form.styles.scss';

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const { basketTotal } = useContext(BasketContext);
  const { currentCustomer } = useContext(CustomerContext);

  const paymentHandler = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !basketTotal) {
      return;
    }

    const response = await fetch('/.netlify/functions/create-payment-intent', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: basketTotal * 100 }),
    }).then((res) => {
      const resJ = res.json();
      return resJ;
    });

    const clientSecret = response.paymentIntent.client_secret;

    const paymentResult = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Hannah Lynn',
        },
      },
    });

    console.log('paymentResult :', paymentResult);
    if (paymentResult.error) {
      alert(paymentResult.error.message);
    } else {
      if (paymentResult.paymentIntent.status === 'succeeded') {
        createOrder(paymentResult);
        alert(`Payment for £${basketTotal} successful`);
      }
    }
  };

  const createOrder = async (paymentResult) => {
    try {
      await createOrderDocument(currentCustomer, paymentResult);
    } catch (err) {
      console.log('error', err);
    }
  };

  return (
    <div className='payment-form'>
      <form action='submit' onSubmit={paymentHandler}>
        <CardElement options={{ hidePostalCode: true }} />
        <FormButton type='submit'>Pay Now</FormButton>
      </form>
    </div>
  );
};

export default PaymentForm;
