import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

type FeatureItem = {
  title: string;
  description: JSX.Element;
  to?: string
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Бернулли',
    to: 'Бернулли',
    description: (
      <>
        Статистические характеристики наборов данных дискретных случайных
        величин
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    description: (
      <>
        Docusaurus lets you focus on your docs, and we&apos;ll do the chores. Go
        ahead and move your docs into the <code>docs</code> directory.
      </>
    ),
  },
  {
    title: 'Powered by React',
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can
        be extended while reusing the same header and footer.
      </>
    ),
  },
];

function Feature({ title, description, to }: FeatureItem) {
  return (
    <Link to={`docs/Работы/${to}`} className={clsx('col col--4')}>

      <Heading as="h3">{title}</Heading>


    </Link>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
