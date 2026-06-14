import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { XEmbed, YouTubeEmbed } from 'react-social-media-embed';

const TweetEmbed = ({ tweetUrls }: any) => {

    const [data, setData] = useState([])

    useEffect(() => {
        async function getTweets() {
            const res = await axios.get('https://docs.google.com/spreadsheets/d/e/2PACX-1vRfoFqWBHtHmkTZRlUoCAF7KmrVufoeBKoVETuwNNF31jKkDeGObr_sn2_VtPhPYEbBAbNv80NnV6xS/pub?output=csv');

            const embedData = res.data
                .split('\n')       // Split by newlines
                .map((row: any) => {
                    const [url, type, time] = row.split(',').map((field: string) => field.trim());
                    return { url, type, time };
                })
                .filter((item: any) => item.url);   // Filter out any empty rows

            // Shuffle the embedData array using Fisher-Yates algorithm
            for (let i = embedData.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [embedData[i], embedData[j]] = [embedData[j], embedData[i]];
            }

            setData(embedData)

            console.log(embedData)
        }

        getTweets();
    }, [])

    return (
        <div>
            {data && data.map((item: any, index: number) => (
                <div key={index}>
                    {item.type === 'Twitter' ? (
                        <XEmbed url={item.url} width={350} />
                    ) : item.type === 'Youtube' ? (
                        <div className='w-[350px] h-[250px] bg-white rounded-xl flex justify-center items-center overflow-hidden'>
                            <YouTubeEmbed url={item.url} width={350} height={250} />
                        </div>
                    ) : null}
                    <div className='h-[20px]' />
                </div>
            ))}
        </div>
    );
};

export default TweetEmbed;
