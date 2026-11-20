import Script from "next/script";
import type { PageDoc } from "@/lib/page/schema";

// An id is only ever letters, digits, hyphen and underscore (the schema
// enforces it); checking again here keeps this file safe on its own.
const clean = (id: string | undefined) => (id && /^[A-Za-z0-9_-]{4,40}$/.test(id) ? id : "");

// Loads the owner's own measurement accounts on the published page: each
// service gets its standard snippet, started with the owner's id, and counts
// the page view. Button clicks are forwarded from track.ts.
export function Integrations({ ids }: { ids: PageDoc["integrations"] }) {
  const meta = clean(ids.metaPixel);
  const tiktok = clean(ids.tiktokPixel);
  const ga = clean(ids.googleAnalytics);
  const clarity = clean(ids.clarity);
  return (
    <>
      {meta ? (
        <Script id="vb-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {tiktok ? (
        <Script id="vb-tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok}');ttq.page()}(window,document,'ttq');`}
        </Script>
      ) : null}
      {ga ? (
        <>
          <Script id="vb-ga-lib" src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="vb-ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      ) : null}
      {clarity ? (
        <Script id="vb-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarity}");`}
        </Script>
      ) : null}
    </>
  );
}
