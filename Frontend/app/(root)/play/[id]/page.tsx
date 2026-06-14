import MatchPage from '@/components/screens/MatchPage'
import React from 'react'

const page = ({ params: { id } }: any) => {
  return (
    <MatchPage id={id}/>
  )
}

export default page