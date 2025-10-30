import { Icon } from '@iconify-icon/react';

export default function DataCard({ dataCard }) {
  return (
    <div className="col-lg-12 pt-3">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between">
            <h5 className="mb-1">AWB Terkirim</h5>
            <div className="dropdown">
              <button
                className="btn btn-text-secondary rounded-pill text-body-secondary border-0 p-1"
                type="button"
                id="salesOverview"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i className="icon-base ri ri-more-2-line"></i>
              </button>
              <div className="dropdown-menu dropdown-menu-end" aria-labelledby="salesOverview">
                <a className="dropdown-item" href="javascript:void(0);">
                  Refresh
                </a>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center card-subtitle"></div>
        </div>
        <div className="card-body d-flex justify-content-between flex-wrap gap-4">
          <div className="d-flex align-items-center gap-3">
            <div className="avatar">
              <div className="avatar-initial bg-label-primary rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ paddingRight: '5px' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.export_send}</h5>
              <p className="mb-0">Ekspor Terkirim</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar pr-3">
              <div className="avatar-initial bg-label-primary rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ paddingRight: '5px' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.export_send_not}</h5>
              <p className="mb-0">Ekspor Pending</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar">
              <div className="avatar-initial bg-label-primary rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ transform: 'rotate(45deg)' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.import_send}</h5>
              <p className="mb-0">Import Terkirim</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar">
              <div className="avatar-initial bg-label-primary rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ transform: 'rotate(45deg)' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.import_send_not}</h5>
              <p className="mb-0">Import Pending</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar">
              <div className="avatar-initial bg-label-primary rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ transform: 'rotate(45deg)' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.incoming_send}</h5>
              <p className="mb-0">Incoming Terkirim</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar">
              <div className="avatar-initial bg-label-primary rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ transform: 'rotate(45deg)' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.incoming_send_not}</h5>
              <p className="mb-0">Incoming Pending</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar">
              <div className="avatar-initial bg-label-info rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ paddingRight: '5px' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.outgoing_send}</h5>
              <p className="mb-0">Outgoing Terkirim</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="avatar">
              <div className="avatar-initial bg-label-info rounded">
                <Icon
                  icon="openmoji:airplane-departure"
                  width="72"
                  height="72"
                  style={{ paddingRight: '5px' }}
                />
              </div>
            </div>
            <div className="card-info">
              <h5 className="mb-0">{dataCard.outgoing_send_not}</h5>
              <p className="mb-0">Outgoing Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
