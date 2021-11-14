import { createContext, ReactNode, useContext, useState } from 'react';
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

  const saveCart = (newProducts: Product[]) => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts));
    setCart(newProducts);
  }

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get<Product>(`/products/${productId}`);
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
      
      const productExists = cart.find(p => p.id === productId);

      if (productExists) {
        if(productExists.amount === stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          const incrementedProduct = cart.map(p =>
            p.id === productId ? { ...p, amount: p.amount + 1 } : p,
          )
          saveCart(incrementedProduct);
        }
      } else {
        const newProduct = [...cart, { ...data, amount: 1 }];
        saveCart(newProduct);
      }
    } catch(error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(p => p.id !== productId);
      saveCart(newCart);
      setCart(newCart);
    } catch(error) {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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
