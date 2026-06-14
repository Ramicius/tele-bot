'use client'

import React, { useState } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { createUser } from '@/lib/actions/user.actions'
import { useRouter } from 'next/navigation'
import useTelegram from '@/hooks/useTelegram'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'

const Page = () => {

  const [loading, setLoading] = useState(false)
  const [consnet, setConsnet] = useState(false)
  const router = useRouter();
  const { state } = useTelegram()
  const { initData } = state


  const createNewAccount = async () => {
    if (loading || !consnet || !initData) {
      return;
    }

    setLoading(true);

    await createUser(initData)

    router.push('/')

  }

  return (
    <section className='w-full h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-900 to-slate-600 text-white'>
      <ScrollArea className='h-[80%]'>
        <div className='flex justify-center items-center'>
          <div className="items-top flex flex-col gap-3 w-11/12 justify-center items-center text-white px-3 font-semibold">
            <Image src={'/Logoo.jpg'} alt="logo" height={200} width={200} className='rounded-full' />
            <p>In this exciting football simulation game, you take control of teams and determine match outcomes based on the formations and player levels. The game emphasizes strategic planning, allowing you to improve your players by purchasing upgrades with coins earned from winning both Rank and Classic games. Each victory brings you closer to building the ultimate team.</p>
            <p>The game adds an extra layer of excitement by rewarding you with diamonds when you beat stronger teams. These diamonds are a valuable currency in the game and can be used in two main ways. First, you can buy special tokens to display during matches, adding a unique flair to your gameplay. Second, diamonds can be used to participate in a lucky spin, offering a chance to upgrade player positions. The spin system is designed to keep the game engaging: the first four spins favor coin rewards, but persistence is rewarded on the fifth spin with a guaranteed level upgrade card. This ensures that players always have a path to improve their teams, even if luck {`isn't`} on their side initially.</p>
            <p>The combination of strategic gameplay, the thrill of upgrading players, and the anticipation of the lucky spin creates a dynamic and enjoyable experience. As you progress, {`you'll`} need to make smart decisions about when to use your coins and diamonds, and how to best enhance your {`team's`}abilities. With each upgrade, your team becomes stronger, and your chances of winning increase. Play smart, invest wisely, and lead your team to victory in this immersive and rewarding football simulation game!</p>
            <div className='flex flex-row items-center gap-2'>
              <Checkbox id="terms1" className='border-white' checked={consnet} onCheckedChange={() => setConsnet(prev => !prev)} />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms1"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Accept terms and conditions
                </label>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className={`${consnet ? 'bg-slate-900' : 'bg-slate-400'} text-white font-semibold px-3 py-2 rounded-lg mt-4 border-b-4 border-white`} onClick={createNewAccount}>{loading ? 'Please wait...' : 'Create Account'}</div>
    </section>
  )
}

export default Page