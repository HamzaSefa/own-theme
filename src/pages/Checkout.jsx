import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { courses, isPublicCourse } from "../data/courses";
import { prices } from "../data/admin";
import { getAdminPlans, isAvailableBundle } from "../data/adminWorkspace";

export default function Checkout() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedBundleId = searchParams.get("bundle");
  const plans = getAdminPlans();
  const isBundle = courseId === "bundle" || Boolean(selectedBundleId);
  const bundle = isBundle
    ? plans.bundles.find((item) => item.id === (selectedBundleId || plans.bundles[0]?.id))
    : null;
  const course = isBundle
    ? { id: "bundle", title: bundle?.title || "Bundle" }
    : courses.find((item) => item.id === courseId && isPublicCourse(item));
  const publicCourses = courses.filter(isPublicCourse);
  const bundleCourses = bundle
    ? publicCourses.filter((item) => (bundle.includedCourses || []).includes(item.id))
    : [];
  const publicCourseIds = publicCourses.map((item) => item.id);
  const bundleIsAvailable = Boolean(bundle) && isAvailableBundle(bundle, publicCourseIds);

  if (isBundle && !bundleIsAvailable) return <Navigate to="/plans" replace />;
  if (courseId && !isBundle && !course) return <Navigate to="/courses" replace />;
  if (course?.purchaseOption === "Subscription included") return <Navigate to="/plans" replace />;

  if (!courseId) {
    const publicCourseIds = publicCourses.map((item) => item.id);
    const availableBundles = plans.bundles.filter((item) =>
      isAvailableBundle(item, publicCourseIds)
    );
    return (
      <main className="container public-page account-support-page">
        <header className="public-page-intro">
          <span className="eyebrow">CHECKOUT</span>
          <h1>Choose what you want to review.</h1>
          <p>Review an individual one-time course purchase or a published bundle. Payment processing is unavailable in this preview.</p>
        </header>
        <div className="plans-individual-grid">
          {publicCourses.map((item) => (
            <article className="plans-course-card" key={item.id}>
              <span className="eyebrow">{item.tag}</span>
              <h2>{item.title}</h2>
              <div className="plans-course-price">{item.price !== "" && item.price != null ? `$${item.price}` : prices[item.id] != null ? `$${prices[item.id]}` : "Price not set"}<small> one-time</small></div>
              <Link to={`/checkout/${item.id}`} className="text-link">Review course <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
          {availableBundles.map((item) => (
            <article className="plans-course-card" key={item.id}>
              <span className="eyebrow">ONE-TIME BUNDLE</span>
              <h2>{item.title}</h2>
              <div className="plans-course-price">{item.currency || "USD"} {item.price}<small> one-time</small></div>
              <Link to={`/checkout/bundle?bundle=${encodeURIComponent(item.id)}`} className="text-link">Review bundle <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </main>
    );
  }

  const price = isBundle
    ? bundle.price
    : course.price !== "" && course.price != null
      ? course.price
      : prices[course.id];
  const currency = isBundle ? bundle.currency || "USD" : "USD";
  const includedCourses = isBundle ? bundleCourses : [course];

  return (
    <main className="container checkout-page">
      <header className="public-page-intro">
        <span className="eyebrow">ORDER REVIEW · DEMO ONLY</span>
        <h1>Review your selection.</h1>
        <p>This page displays the selected item and price, but checkout is not connected to a payment provider.</p>
      </header>
      <div className="checkout">
        <section className="panel checkout-unavailable">
          <span className="eyebrow">PAYMENT NOT AVAILABLE</span>
          <h2>No payment has been attempted.</h2>
          <p>The website has no payment backend connected. It cannot charge you, create a verified order, or confirm enrollment.</p>
          <button type="button" className="btn btn-primary btn-block" disabled>
            {price == null || price === "" ? "Price not set" : "Checkout unavailable"}
          </button>
          <Link to="/checkout/status" className="text-link">Check order status <span aria-hidden="true">↗</span></Link>
        </section>
        <section className="panel checkout-summary">
          <h2>Order summary</h2>
          {includedCourses.map((item) => (
            <div className="sum-row" key={item.id}><span>{item.title}</span><span>{isBundle ? "Included" : `${currency} ${price}`}</span></div>
          ))}
          <div className="sum-row total"><span>{isBundle ? "Bundle total · one-time" : "Course total · one-time"}</span><span>{price != null && price !== "" ? `${currency} ${price}` : "Not set"}</span></div>
          {isBundle && <p><strong>Access:</strong> {bundle.accessDuration || "Access terms to be confirmed."}</p>}
          <p className="demo-note">This is an order preview only. No recurring subscription is included.</p>
          <Link to={isBundle ? "/plans" : `/courses/${course.id}`} className="text-link">Back to {isBundle ? "plans" : "course details"} <span aria-hidden="true">↗</span></Link>
        </section>
      </div>
    </main>
  );
}
