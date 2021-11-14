import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>(cart);

  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if(cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue])


  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
      
      const updatedCart = [...cart];
      const productExists = updatedCart.find((p) => p.id === productId);
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;
      
      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      if (productExists) {
        productExists.amount = amount;
      } else {
        const { data } = await api.get<Product>(`/products/${productId}`);
        
        const newProduct = {
          ...data,
          amount: 1,
        };
        updatedCart.push(newProduct);
      }
      setCart(updatedCart);
    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find((p) => p.id === productId);
      if (productExists) {
        const newCart = cart.filter((p) => p.id !== productId);
        setCart(newCart);
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch (error) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount === 0) return;
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
      const updateProduct = cart.map((p) =>
        p.id === productId ? { ...p, amount } : p
      );

      if (amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        setCart(updateProduct);
      }
    } catch (error) {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
